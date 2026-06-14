(() => {
  const iconPaths = {
    "calendar-days": '<path d="M8 2v4M16 2v4M3 10h18"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    "chart-no-axes-column": '<path d="M5 21V10M12 21V3M19 21v-6"/>',
    cloud: '<path d="M17.5 19H8a6 6 0 1 1 1.2-11.88A7 7 0 0 1 22 11.5 4.5 4.5 0 0 1 17.5 19Z"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    "folder-kanban": '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/><path d="M8 10v4M12 10v6M16 10v2"/>',
    "list-todo": '<path d="M13 5h8M13 12h8M13 19h8"/><path d="m3 5 1.5 1.5L8 3"/><path d="m3 12 1.5 1.5L8 10"/><path d="m3 19 1.5 1.5L8 17"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    "square-pen": '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
  };

  function createIcons() {
    document.querySelectorAll("i[data-lucide]").forEach((node) => {
      const name = node.dataset.lucide;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = iconPaths[name] ?? '<circle cx="12" cy="12" r="9"/>';
      node.replaceWith(svg);
    });
  }

  window.lucide = { createIcons };
})();
