/**
 * DEPRECATED for Livro desks that already ship wela_generics_v15 Giya bubble.
 * If you paste this, it only mounts when #bbai-chat-root is missing, and NEVER
 * uses window.open — iframe bubble only. DOM ids keep the legacy bbai-* prefix.
 */
(function () {
  if (document.getElementById("bbai-chat-root")) return;

  var GIYA_ORIGIN =
    window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? window.location.protocol + "//" + window.location.hostname + ":3000"
      : "http://127.0.0.1:3000";

  function buildUrl(sid) {
    return (
      GIYA_ORIGIN.replace(/\/+$/, "") +
      "/sign-in?embed=1&sid=" +
      encodeURIComponent(sid) +
      "&parent=" +
      encodeURIComponent(window.location.origin)
    );
  }

  function ensure() {
    if (document.getElementById("bbai-chat-root")) return;
    var root = document.createElement("div");
    root.id = "bbai-chat-root";
    root.innerHTML =
      '<div id="bbai-chat-panel" style="display:none;position:fixed;right:20px;bottom:92px;z-index:100050;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.22)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:#1972f5;color:#fff"><strong>Giya</strong>' +
      '<button type="button" id="bbai-chat-close" style="border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer">×</button></div>' +
      '<iframe id="bbai-chat-frame" title="Giya" style="flex:1;width:100%;border:0" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div>' +
      '<button type="button" id="bbai-fab" style="position:fixed;right:20px;bottom:20px;z-index:100051;width:60px;height:60px;border:0;border-radius:50%;background:#1972f5;color:#fff;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer">AI</button>';
    document.body.appendChild(root);
    document.getElementById("bbai-chat-close").onclick = function () {
      document.getElementById("bbai-chat-panel").style.display = "none";
    };
    document.getElementById("bbai-fab").onclick = function () {
      var panel = document.getElementById("bbai-chat-panel");
      if (panel.style.display === "flex") {
        panel.style.display = "none";
        return;
      }
      frappe.call({
        method: "wela_generics_v15.utils.bbai.get_session_sid",
        callback: function (r) {
          var sid = r.message;
          if (!sid || sid === "Guest") {
            frappe.msgprint("Please log in first.");
            return;
          }
          var frame = document.getElementById("bbai-chat-frame");
          var url = buildUrl(sid);
          if (frame.getAttribute("src") !== url) frame.setAttribute("src", url);
          panel.style.display = "flex";
        },
      });
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensure);
  } else {
    ensure();
  }
})();
