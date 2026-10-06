// Line-icon set (24x24). Use window.icon("name") to get inline SVG.
(function () {
  var P = {
    steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3M4 3h4M12 3h4M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
    heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',
    bone: '<path d="M8 16L16 8"/><circle cx="6" cy="15" r="2.2"/><circle cx="9" cy="18" r="2.2"/><circle cx="15" cy="6" r="2.2"/><circle cx="18" cy="9" r="2.2"/>',
    woman: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8c-3 0-5 3-5 6h10c0-3-2-6-5-6zM9 14l-2 7h10l-2-7"/>',
    child: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>',
    brain: '<path d="M12 4v16M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3"/>',
    ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0M11 9a1.5 1.5 0 0 1 3 0"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    ambulance: '<path d="M3 16V7h11v9M14 10h4l3 3v3h-2M3 16h2M9 16h6"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M8.5 9v4M6.5 11h4"/>',
    icu: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M6 11h3l2-3 2 5 2-2h3M9 20h6M12 16v4"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M8 15h8"/>',
    xray: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v10M8 9h8M8 12h8M8 15h8"/>',
    pill: '<path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7zM8.5 8.5l7 7"/>',
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
    surgery: '<path d="M4 20L15 9M13 7l4 4M15 9l4-4a2 2 0 0 1 0 3l-3 3"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h6"/>',
    doctor: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7M10 15l2 3 2-3"/>',
    rupee: '<path d="M7 5h10M7 9h10M7 5c6 0 6 8 0 8h-1l7 7"/>',
    microscope: '<path d="M7 21h10M9 3l4 4M8 12l4 4M12 17a5 5 0 0 0 0-10"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
    pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5z"/><path d="M9 9c0 3 3 6 6 6l1.5-1.5-2.5-1.5-1 1c-1-.5-2-1.5-2.5-2.5l1-1L10 6.5z"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke-width="3"/>',
    cross: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>'
  };
  window.icon = function (n, cls) {
    return '<svg class="svg-i ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || P.cross) + '</svg>';
  };
})();
