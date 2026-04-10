// InstaSaver — frontend behaviour
(function () {
  "use strict";

  var form = document.getElementById("downloader-form");
  if (!form) return;

  var input = document.getElementById("insta-url");
  var result = document.getElementById("tool-result");
  var button = form.querySelector("button");

  var igPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv|stories)\/[^\s/]+/i;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var url = (input.value || "").trim();

    if (!url) {
      showResult("Please paste an Instagram link (Reel, Post, Story or IGTV URL).", "warn");
      return;
    }

    if (!igPattern.test(url)) {
      showResult(
        "That does not look like a valid Instagram URL. It should start with https://www.instagram.com/reel/... or /p/... or /tv/...",
        "warn"
      );
      return;
    }

    // Call backend API
    button.disabled = true;
    button.textContent = "Processing...";
    result.className = "tool-result";

    fetch("/api/instagram/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (res) {
        button.disabled = false;
        button.textContent = "Download";

        if (res.status === 429) {
          showResult("Too many requests. Please wait a few minutes and try again.", "warn");
          return;
        }

        if (res.status !== 200 || !res.data.success) {
          showResult(
            res.data.error ||
              "Could not extract media. The post may be private or deleted.",
            "warn"
          );
          return;
        }

        renderResult(res.data.data);
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = "Download";
        showResult(
          "Network error. Please check your connection and try again.",
          "warn"
        );
      });
  });

  // ── Render download result ──────────────────────────────────
  function renderResult(data) {
    var html = '<div class="dl-result">';

    // Header
    html += '<div class="dl-header">';
    if (data.thumbnail) {
      html +=
        '<img class="dl-thumb" src="' +
        escapeAttr(data.thumbnail) +
        '" alt="Preview" loading="lazy">';
    }
    html += "<div>";
    if (data.username) {
      html += '<p class="dl-user">' + escapeHtml(data.username) + "</p>";
    }
    if (data.caption) {
      var short =
        data.caption.length > 120
          ? data.caption.substring(0, 120) + "..."
          : data.caption;
      html += '<p class="dl-caption">' + escapeHtml(short) + "</p>";
    }
    html +=
      '<p class="dl-meta">' +
      escapeHtml(data.type || "media") +
      " &middot; " +
      data.media.length +
      " file(s)</p>";
    html += "</div></div>";

    // Download buttons
    html += '<div class="dl-buttons">';
    data.media.forEach(function (item, i) {
      var label =
        item.type === "video"
          ? "Download Video" + (item.quality ? " (" + item.quality + ")" : "")
          : "Download Image" +
            (item.quality ? " (" + item.quality + ")" : "");
      if (data.media.length > 1) {
        label += " #" + (item.index || i + 1);
      }
      html +=
        '<a class="dl-btn" href="' +
        escapeAttr(item.url) +
        '" target="_blank" rel="noopener noreferrer" download>' +
        escapeHtml(label) +
        "</a>";
    });
    html += "</div>";

    // Disclaimer
    html +=
      '<p class="dl-disclaimer">Please make sure the content belongs to you or you have permission to download it. ' +
      'Read our <a href="./disclaimer.html">disclaimer</a> and <a href="./terms.html">terms of use</a>.</p>';

    html += "</div>";
    result.innerHTML = html;
    result.className = "tool-result show";
  }

  function showResult(msg, type) {
    result.innerHTML = msg;
    result.className = "tool-result show " + (type || "");
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Paste helper
  input.addEventListener("paste", function () {
    setTimeout(function () {
      if (igPattern.test(input.value.trim())) {
        result.className = "tool-result";
      }
    }, 50);
  });
})();
