const palette = document.getElementById("palette");
const workspace = document.getElementById("workspace");

Sortable.create(palette, {
  group: {
    name: "blocks",
    pull: "clone",
    put: false
  },
  sort: false,
  animation: 150
});

Sortable.create(workspace, {
  group: {
    name: "blocks",
    pull: true,
    put: true
  },
  sort: true,
  animation: 150
});

workspace.addEventListener("dblclick", (e) => {
  if (e.target.classList.contains("block")) {
    e.target.remove();
  }
});
