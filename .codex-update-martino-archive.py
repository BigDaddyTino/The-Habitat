from hashlib import sha256
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


root = Path(r"C:\mnt\data")
names = [
    "mara-quill.png",
    "keira-ansel.png",
    "nalia-reed.png",
    "selene-ward.png",
    "jaro-fen.png",
    "tomas-vey.png",
]
target = root / "martino-characters.zip"

with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for name in names:
        archive.write(root / name, arcname=name)

with ZipFile(target, "r") as archive:
    archived_tomas_hash = sha256(archive.read("tomas-vey.png")).hexdigest().upper()

print(f"archive={target}")
print(f"entries={','.join(names)}")
print(f"tomas_sha256={archived_tomas_hash}")
