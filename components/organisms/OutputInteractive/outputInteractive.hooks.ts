"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BBAI_OUTPUT_EVENT,
  FRAPPE_OUTPUT_KIND,
  buildFrappeDeskSourcePath,
  buildFrappeOutputPath,
  canOpenOutputTarget,
  sourceFieldDefsForKind,
  type FrappeOutputKind,
  type FrappeOutputTarget,
  type FrappeSourceFieldDef,
} from "@/lib/entities/frappe_output.type";
import { readSchoolErpMcpSessionFromBrowser } from "@/lib/entities/erpnext.type";

export type OutputPaneTab = "preview" | "source";

export type OutputInteractiveState = {
  kind: FrappeOutputKind;
  title: string | null;
  target: FrappeOutputTarget | null;
  /** Direct ERP URL (open in new tab). */
  sourceUrl: string | null;
  /** Same-origin mini-browser URL (uses School MCP SID cookie). */
  frameUrl: string | null;
  status: string | null;
  loading: boolean;
  error: string | null;
};

export type SourceEditorState = {
  doctype: string;
  name: string;
  title: string;
  fields: Record<string, string>;
  availableKeys: string[];
  activeField: string;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  emptyContent: boolean;
  contentType: string | null;
};

export type SchoolOutputSession = {
  sid: string;
  baseUrl: string;
};

const EMPTY: OutputInteractiveState = {
  kind: FRAPPE_OUTPUT_KIND.PRINT_FORMAT,
  title: null,
  target: null,
  sourceUrl: null,
  frameUrl: null,
  status: null,
  loading: false,
  error: null,
};

const EMPTY_SOURCE: SourceEditorState = {
  doctype: "",
  name: "",
  title: "",
  fields: {},
  availableKeys: [],
  activeField: "",
  dirty: false,
  loading: false,
  saving: false,
  error: null,
  savedAt: null,
  emptyContent: false,
  contentType: null,
};

/** Survives mount race: chat may dispatch before Output panel mounts. */
let pendingOutputTarget: FrappeOutputTarget | null = null;

function targetKey(target: FrappeOutputTarget, session: SchoolOutputSession | null) {
  return [
    session?.baseUrl ?? "",
    session?.sid ?? "",
    target.kind,
    target.doctype ?? "",
    target.name ?? "",
    target.format ?? "",
    target.route ?? "",
  ].join("|");
}

function isTargetReady(target: FrappeOutputTarget): boolean {
  return canOpenOutputTarget(target);
}

/** School MCP SID only — same source as `school_erpnext` custom tools / rail. */
export function readSchoolSession(): SchoolOutputSession | null {
  return readSchoolErpMcpSessionFromBrowser();
}

async function bindSchoolPreviewSession(session: SchoolOutputSession): Promise<boolean> {
  const res = await fetch("/api/erp/output/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sid: session.sid, baseUrl: session.baseUrl }),
  });
  return res.ok;
}

export function useOutputInteractive() {
  const [state, setState] = useState<OutputInteractiveState>(EMPTY);
  const [tab, setTab] = useState<OutputPaneTab>("preview");
  const [source, setSource] = useState<SourceEditorState>(EMPTY_SOURCE);
  const [schoolSession, setSchoolSession] = useState<SchoolOutputSession | null>(null);
  const lastLoadedKeyRef = useRef<string>("");
  const loadingRef = useRef(false);
  const targetRef = useRef<FrappeOutputTarget | null>(null);

  const refreshSchoolSession = useCallback(() => {
    const session = readSchoolSession();
    setSchoolSession(session);
    return session;
  }, []);

  const loadSourceDoc = useCallback(
    async (target: FrappeOutputTarget, session: SchoolOutputSession) => {
      setSource((s) => ({
        ...EMPTY_SOURCE,
        loading: true,
        error: null,
        activeField: s.activeField,
      }));

      try {
        const res = await fetch("/api/erp/output/source", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "get",
            sid: session.sid,
            baseUrl: session.baseUrl,
            target,
          }),
        });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          data?: {
            doctype: string;
            name: string;
            title: string;
            fields: Record<string, string>;
            availableKeys: string[];
            emptyContent?: boolean;
            contentType?: string;
          };
        };

        if (!json.ok || !json.data) {
          setSource({
            ...EMPTY_SOURCE,
            loading: false,
            error: json.error || "Could not load source document.",
          });
          return;
        }

        const defs = sourceFieldDefsForKind(target.kind);
        // Prefer the primary content field for each kind (HTML / client_script / html).
        const preferredOrder =
          target.kind === FRAPPE_OUTPUT_KIND.WEBPAGE
            ? ["main_section_html", "main_section_md", "javascript", "css"]
            : target.kind === FRAPPE_OUTPUT_KIND.WEBFORM
              ? ["client_script", "custom_css"]
              : ["html", "css", "doc_type"];
        const preferred =
          preferredOrder.find((k) => json.data!.availableKeys.includes(k)) ||
          defs.find((d) => json.data!.availableKeys.includes(d.key))?.key ||
          json.data.availableKeys[0] ||
          "";

        setSource({
          doctype: json.data.doctype,
          name: json.data.name,
          title: json.data.title,
          fields: json.data.fields,
          availableKeys: json.data.availableKeys,
          activeField: preferred,
          dirty: false,
          loading: false,
          saving: false,
          error: null,
          savedAt: null,
          emptyContent: Boolean(json.data.emptyContent),
          contentType: json.data.contentType ?? null,
        });
      } catch (error) {
        setSource({
          ...EMPTY_SOURCE,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load source.",
        });
      }
    },
    [],
  );

  const loadTarget = useCallback(
    async (target: FrappeOutputTarget, opts?: { force?: boolean }) => {
      pendingOutputTarget = target;
      targetRef.current = target;

      const session = refreshSchoolSession();
      if (!session) {
        setState((s) => ({
          ...s,
          target,
          error: null,
          loading: false,
          status: "Waiting for School ERP session…",
          frameUrl: null,
        }));
        return;
      }

      if (!isTargetReady(target)) {
        setState((s) => ({
          ...s,
          target,
          error: null,
          loading: false,
          status: "Waiting for a complete output target from chat…",
          frameUrl: null,
        }));
        return;
      }

      const path = buildFrappeOutputPath(target);
      const key = targetKey(target, session);
      if (!opts?.force && key === lastLoadedKeyRef.current && !loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      lastLoadedKeyRef.current = key;
      pendingOutputTarget = null;

      const title =
        target.title ||
        target.format ||
        target.name ||
        target.route ||
        null;

      const deskPath = buildFrappeDeskSourcePath(target);
      const deskSourceUrl = deskPath
        ? `${session.baseUrl}${deskPath}`
        : path
          ? `${session.baseUrl}${path}`
          : null;

      setState({
        kind: target.kind,
        title,
        target,
        sourceUrl: deskSourceUrl,
        frameUrl: null,
        status: `Binding School MCP SID · ${session.baseUrl.replace(/^https?:\/\//, "")}…`,
        loading: true,
        error: null,
      });

      try {
        const bound = await bindSchoolPreviewSession(session);
        if (!bound) {
          loadingRef.current = false;
          setState((s) => ({
            ...s,
            loading: false,
            status: null,
            error: "Could not bind School MCP session for preview. Reconnect School ERP.",
          }));
          return;
        }

        // Source can open with Print Format name alone; Preview needs Class (doctype+name+format).
        void loadSourceDoc(target, session);

        if (!path) {
          loadingRef.current = false;
          setState({
            kind: target.kind,
            title,
            target,
            sourceUrl: deskSourceUrl,
            frameUrl: null,
            status: null,
            loading: false,
            error: null,
          });
          setTab("source");
          return;
        }

        const frameUrl = `/api/erp/output/browse?path=${encodeURIComponent(path)}&_=${Date.now()}`;
        loadingRef.current = false;
        setState({
          kind: target.kind,
          title,
          target,
          sourceUrl: deskSourceUrl || `${session.baseUrl}${path}`,
          frameUrl,
          status: "Live",
          loading: false,
          error: null,
        });
      } catch (error) {
        loadingRef.current = false;
        setState((s) => ({
          ...s,
          loading: false,
          status: null,
          frameUrl: null,
          error: error instanceof Error ? error.message : "Preview failed.",
        }));
      }
    },
    [loadSourceDoc, refreshSchoolSession],
  );

  useEffect(() => {
    refreshSchoolSession();

    const onSession = () => {
      const session = refreshSchoolSession();
      if (session && pendingOutputTarget) {
        void loadTarget(pendingOutputTarget, { force: true });
      } else if (session) {
        void bindSchoolPreviewSession(session);
      }
    };

    const onTarget = (event: Event) => {
      const detail = (event as CustomEvent<FrappeOutputTarget>).detail;
      if (detail?.kind) {
        setTab("preview");
        void loadTarget(detail, { force: true });
      }
    };

    window.addEventListener("bbai-school-erp-session", onSession);
    window.addEventListener("bbai-erp-session", onSession);
    window.addEventListener("storage", onSession);
    window.addEventListener(BBAI_OUTPUT_EVENT, onTarget);

    const session = readSchoolSession();
    if (session) void bindSchoolPreviewSession(session);

    if (pendingOutputTarget) {
      void loadTarget(pendingOutputTarget, { force: true });
    }

    return () => {
      window.removeEventListener("bbai-school-erp-session", onSession);
      window.removeEventListener("bbai-erp-session", onSession);
      window.removeEventListener("storage", onSession);
      window.removeEventListener(BBAI_OUTPUT_EVENT, onTarget);
    };
  }, [loadTarget, refreshSchoolSession]);

  const clear = useCallback(() => {
    pendingOutputTarget = null;
    targetRef.current = null;
    lastLoadedKeyRef.current = "";
    loadingRef.current = false;
    setTab("preview");
    setState(EMPTY);
    setSource(EMPTY_SOURCE);
    void fetch("/api/erp/output/session", { method: "DELETE", credentials: "include" });
  }, []);

  const reload = useCallback(() => {
    setState((s) => {
      if (!s.frameUrl) return s;
      const url = new URL(s.frameUrl, window.location.origin);
      url.searchParams.set("_", String(Date.now()));
      return {
        ...s,
        frameUrl: `${url.pathname}?${url.searchParams.toString()}`,
        error: null,
        status: "Live",
      };
    });
  }, []);

  const setActiveField = useCallback((key: string) => {
    setSource((s) => ({ ...s, activeField: key }));
  }, []);

  const setFieldValue = useCallback((key: string, value: string) => {
    setSource((s) => ({
      ...s,
      fields: { ...s.fields, [key]: value },
      dirty: true,
      savedAt: null,
      error: null,
    }));
  }, []);

  const refreshSource = useCallback(() => {
    const session = refreshSchoolSession();
    const target = targetRef.current;
    if (!session || !target) return;
    void loadSourceDoc(target, session);
  }, [loadSourceDoc, refreshSchoolSession]);

  const saveSource = useCallback(async () => {
    const session = refreshSchoolSession();
    if (!session) {
      setSource((s) => ({ ...s, error: "Connect School ERP first." }));
      return;
    }
    if (!source.doctype || !source.name) {
      setSource((s) => ({ ...s, error: "No source document loaded." }));
      return;
    }

    setSource((s) => ({ ...s, saving: true, error: null }));
    try {
      const res = await fetch("/api/erp/output/source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save",
          sid: session.sid,
          baseUrl: session.baseUrl,
          doctype: source.doctype,
          name: source.name,
          fields: source.fields,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) {
        setSource((s) => ({
          ...s,
          saving: false,
          error: json.error || "Save failed.",
        }));
        return;
      }

      setSource((s) => ({
        ...s,
        saving: false,
        dirty: false,
        savedAt: new Date().toLocaleTimeString(),
        error: null,
      }));
      // Refresh mini-browser so Preview shows saved content
      reload();
    } catch (error) {
      setSource((s) => ({
        ...s,
        saving: false,
        error: error instanceof Error ? error.message : "Save failed.",
      }));
    }
  }, [refreshSchoolSession, reload, source.doctype, source.fields, source.name]);

  const fieldDefs: FrappeSourceFieldDef[] = sourceFieldDefsForKind(state.kind).filter((d) =>
    source.availableKeys.includes(d.key),
  );

  return {
    state,
    tab,
    setTab,
    source,
    fieldDefs,
    setActiveField,
    setFieldValue,
    saveSource,
    refreshSource,
    clear,
    reload,
    schoolSession,
    refreshSchoolSession,
  };
}

export function dispatchOutputTarget(target: FrappeOutputTarget) {
  pendingOutputTarget = target;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BBAI_OUTPUT_EVENT, { detail: target }));
}

export function clearPendingOutputTarget() {
  pendingOutputTarget = null;
}
