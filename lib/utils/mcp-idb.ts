"use client";

import { USER_AI_CONFIG_DEFAULT, type UserAiConfig } from "@/lib/entities/mcp_server.type";

const DB_NAME = "antigravity_mcp_db";
const DB_VERSION = 1;
const STORE_NAME = "user_ai_config";
const CONFIG_KEY = "current_config";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function loadUserAiConfigFromIdb(): Promise<UserAiConfig> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(CONFIG_KEY);
      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve({ ...USER_AI_CONFIG_DEFAULT, ...getReq.result });
        } else {
          resolve(USER_AI_CONFIG_DEFAULT);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (error) {
    console.warn("Could not load from IndexedDB, using default config:", error);
    return USER_AI_CONFIG_DEFAULT;
  }
}

export async function saveUserAiConfigToIdb(config: UserAiConfig): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(config, CONFIG_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
  }
}
