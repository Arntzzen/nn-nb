const api = globalThis.browser || globalThis.chrome;

const toggle = document.getElementById("toggle");
const stat = document.getElementById("stat");

function updateStatus(enabled) {
  stat.textContent = enabled
    ? "Oversettelse aktiv"
    : "Oversettelse deaktivert";
}

async function loadSettings() {
  try {
    const settings = await api.storage.local.get({
      enabled: true
    });

    toggle.checked = settings.enabled;
    updateStatus(settings.enabled);
  } catch (error) {
    stat.textContent = "Kunne ikke laste innstillinger";
    console.error(error);
  }
}

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;

  try {
    await api.storage.local.set({ enabled });
    updateStatus(enabled);
  } catch (error) {
    toggle.checked = !enabled;
    updateStatus(!enabled);
    console.error(error);
  }
});

loadSettings();
