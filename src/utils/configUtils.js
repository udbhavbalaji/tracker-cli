import fs from "fs";

export function checkPermissionError(err) {
  if (err.code === "EACCES") {
    console.error(
      "Permission denied. Use 'sudo tracker init' to initialize the app."
    );
    process.exit(1);
  } else {
    throw err;
  }
}

export function storeSudoUserInfo() {
  return {
    uid: process.env.SUDO_UID,
    gid: process.env.SUDO_GID,
    username: process.env.SUDO_USER,
  };
}

export function createUserOwnedDirs(dirs, uid, gid) {
  for (let i = 0; i < dirs.length; i++) {
    try {
      fs.mkdirSync(dirs[i], { recursive: true });
      fs.chownSync(dirs[i], parseInt(uid), parseInt(gid));
    } catch (err) {
      checkPermissionError(err);
    }
  }
}
