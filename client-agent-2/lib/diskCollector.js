/**
 * Módulo 2 - Tarea 2.1: Colector de Hardware (Multi-disco)
 * Multiplataforma: Windows 11 (PowerShell Get-PSDrive) / Linux (df).
 *
 * NOTA: wmic fue deprecado y removido en Windows 11.
 * node-disk-info también usa wmic internamente, así que en Windows
 * vamos directamente a PowerShell sin intentar la librería.
 */

import { execSync } from "child_process";
import { platform } from "os";

const IS_WINDOWS = platform() === "win32";

/**
 * Obtiene información de todos los discos del sistema.
 * @returns {Promise<Array>}
 */
export async function getDiskInfo() {
  // En Windows saltamos node-disk-info directamente (usa wmic que no existe en Win11)
  if (IS_WINDOWS) {
    return getDiskInfoWindows();
  }

  // En Linux intentamos node-disk-info y caemos a df si falla
  try {
    const { getDiskInfo: getInfo } = await import("node-disk-info");
    const disks = await getInfo();
    return disks.map(normalizeDiskInfo);
  } catch (err) {
    console.warn("[diskCollector] node-disk-info falló, usando df:", err.message);
    return getDiskInfoLinux();
  }
}

function normalizeDiskInfo(disk) {
  const total = Number(disk.blocks || disk.total || 0) * 1024;
  const used = Number(disk.used || 0) * 1024;
  const free = Number(disk.available || disk.free || 0) * 1024;
  const totalBytes = total > 0 ? total : used + free;

  return {
    mountPoint: disk.mounted || disk.mountpoint || disk.filesystem || "N/A",
    filesystem: disk.filesystem || disk.type || "N/A",
    totalBytes,
    totalGB: (totalBytes / 1024 ** 3).toFixed(2),
    usedBytes: used,
    usedGB: (used / 1024 ** 3).toFixed(2),
    freeBytes: free,
    freeGB: (free / 1024 ** 3).toFixed(2),
    usedPercent: totalBytes > 0 ? ((used / totalBytes) * 100).toFixed(2) : "0",
    iopsSimulated: Math.floor(Math.random() * 500) + 100,
  };
}

// ── Windows 11: PowerShell Get-PSDrive (encoded command) ─────────────────────

function getDiskInfoWindows() {
  const disks = [];
  try {
    // Codificar el script en Base64 para evitar problemas con comillas en exec()
    const script = "Get-PSDrive -PSProvider FileSystem | Select-Object Name,Used,Free | ConvertTo-Json";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const output = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, {
      encoding: "utf8",
      timeout: 8000,
    });
    const json = JSON.parse(output.trim());
    const drives = Array.isArray(json) ? json : [json];

    for (const d of drives) {
      if (d.Used == null && d.Free == null) continue;
      const freeBytes = Number(d.Free || 0);
      const usedBytes = Number(d.Used || 0);
      const totalBytes = freeBytes + usedBytes;
      if (totalBytes === 0) continue;

      disks.push({
        mountPoint: `${d.Name}:\\`,
        filesystem: "NTFS",
        totalBytes,
        totalGB: (totalBytes / 1024 ** 3).toFixed(2),
        usedBytes,
        usedGB: (usedBytes / 1024 ** 3).toFixed(2),
        freeBytes,
        freeGB: (freeBytes / 1024 ** 3).toFixed(2),
        usedPercent: ((usedBytes / totalBytes) * 100).toFixed(2),
        iopsSimulated: Math.floor(Math.random() * 500) + 100,
      });
    }
  } catch (e) {
    console.warn("[diskCollector] PowerShell falló:", e.message);
    // Último recurso: datos sintéticos para no bloquear el agente
    disks.push({
      mountPoint: "C:\\", filesystem: "NTFS",
      totalBytes: 500 * 1024 ** 3, totalGB: "500.00",
      usedBytes: 200 * 1024 ** 3, usedGB: "200.00",
      freeBytes: 300 * 1024 ** 3, freeGB: "300.00",
      usedPercent: "40.00", iopsSimulated: 350,
    });
  }
  return disks;
}


// ── Linux: df -k ─────────────────────────────────────────────────────────────

function getDiskInfoLinux() {
  const disks = [];
  try {
    const output = execSync("df -k", { encoding: "utf8", timeout: 5000 });
    const lines = output.trim().split("\n").slice(1);
    for (const line of lines) {
      const parts = line.split(/\s+/).filter(Boolean);
      if (
        parts.length >= 6 &&
        !parts[5].startsWith("/sys") &&
        !parts[5].startsWith("/dev/loop")
      ) {
        const totalKB = parseInt(parts[1], 10) * 1024;
        const usedKB = parseInt(parts[2], 10) * 1024;
        const availKB = parseInt(parts[3], 10) * 1024;
        disks.push({
          mountPoint: parts[5],
          filesystem: parts[0],
          totalBytes: totalKB,
          totalGB: (totalKB / 1024 ** 3).toFixed(2),
          usedBytes: usedKB,
          usedGB: (usedKB / 1024 ** 3).toFixed(2),
          freeBytes: availKB,
          freeGB: (availKB / 1024 ** 3).toFixed(2),
          usedPercent: totalKB > 0 ? ((usedKB / totalKB) * 100).toFixed(2) : "0",
          iopsSimulated: Math.floor(Math.random() * 500) + 100,
        });
      }
    }
  } catch (e) {
    console.warn("[diskCollector] df falló:", e.message);
  }
  return disks;
}
