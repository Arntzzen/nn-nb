from pathlib import Path
import shutil

# Finn prosjektmappen automatisk
ROOT = Path(__file__).resolve().parent

SHARED = ROOT / "shared"

BROWSERS = [
    ROOT / "chrome",
    ROOT / "firefox"
]

FILES = [
    "translator.js",
    "dictionary.json",
    "content.js",
    "popup.html",
    "popup.css",
    "popup.js"
]


def build():
    print("\nBygger Nynorsk til Bokmål...")
    print("--------------------------------")

    if not SHARED.exists():
        print("FEIL: Fant ikke shared-mappen.")
        return

    for browser in BROWSERS:

        if not browser.exists():
            print(f"Oppretter mappe: {browser.name}")
            browser.mkdir(parents=True)

        manifest = browser / "manifest.json"

        if not manifest.exists():
            print(
                f"ADVARSEL: {browser.name} mangler manifest.json"
            )
            continue

        print(f"\nBygger for {browser.name}:")

        for filename in FILES:
            source = SHARED / filename
            destination = browser / filename

            if not source.exists():
                print(f"  FEIL: Fant ikke {filename}")
                continue

            shutil.copy2(source, destination)

            print(f"  OK: {filename}")

    print("\n--------------------------------")
    print("Bygging fullført!")


if __name__ == "__main__":
    build()
