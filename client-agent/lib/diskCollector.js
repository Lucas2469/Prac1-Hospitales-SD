/**
 * Módulo 2 - Tarea 2.1: Colector de Hardware (Multi-disco)
 * Identifica todos los discos, capacidad total, uso y espacio libre.
 * Soporta Windows y Linux (multiplataforma).
 */

import { execSync } from "child_process";
import { platform } from "os";

/**
 * Obtiene información de todos los discos del sistema.
 * @returns {Promise<Array>} Array de objetos con info de cada disco
 */
export async function getDiskInfo() {
  try {
    const { getDiskInfo: getInfo } = await import("node-disk-info");
    const disks = await getInfo();
    return disks.map((d) => normalizeDiskInfo(d));
  } catch (err) {
    console.warn("[diskCollector] node-disk-info falló, usando fallback:", err.message);
    return getDiskInfoFallback();
  }
}

function normalizeDiskInfo(disk) {
  const total = Number(disk.blocks || disk.total || 0) * 1024;
  const used = Number(disk.used || disk.available || 0) * 1024;
  const free = Number(disk.available || disk.free || 0) * 1024;
  const totalBytes = total > 0 ? total : used + free;

  return {
    mountPoint: disk.mounted || disk.mountpoint || disk.filesystem || "N/A",
    filesystem: disk.filesystem || disk.type || "N/A",
    totalBytes,
    totalGB: (totalBytes / (1024 ** 3)).toFixed(2),
    usedBytes: used,
    usedGB: (used / (1024 ** 3)).toFixed(2),
    freeBytes: free,
    freeGB: (free / (1024 ** 3)).toFixed(2),
    usedPercent: totalBytes > 0 ? ((used / totalBytes) * 100).toFixed(2) : "0",
    iopsSimulated: Math.floor(Math.random() * 500) + 100,
  };
}

function getDiskInfoFallback() {
  const disks = [];
  try {
    if (platform() === "win32") {
      const output = execSync(
        'wmic logicaldisk get size,freespace,caption /format:csv',
        { encoding: "utf8", timeout: 5000 }
      );
      const lines = output.trim().split("\n").slice(1);
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 4) {
          const caption = parts[1] || "N/A";
          const freeBytes = BigInt(parts[2] || 0);
          const totalBytes = BigInt(parts[3] || 0) || freeBytes;
          disks.push({
            mountPoint: caption,
            filesystem: "NTFS",
            totalBytes: Number(totalBytes),
            totalGB: (Number(totalBytes) / (1024 ** 3)).toFixed(2),
            usedBytes: Number(totalBytes - freeBytes),
            usedGB: (Number(totalBytes - freeBytes) / (1024 ** 3)).toFixed(2),
            freeBytes: Number(freeBytes),
            freeGB: (Number(freeBytes) / (1024 ** 3)).toFixed(2),
            usedPercent: Number(totalBytes) > 0
              ? ((Number(totalBytes - freeBytes) / Number(totalBytes)) * 100).toFixed(2)
              : "0",
            iopsSimulated: Math.floor(Math.random() * 500) + 100,
          });
        }
      }
    } else {
      const output = execSync("df -k", { encoding: "utf8", timeout: 5000 });
      const lines = output.trim().split("\n").slice(1);
      for (const line of lines) {
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length >= 6 && !parts[5].startsWith("/sys") && !parts[5].startsWith("/dev/loop")) {
          const totalKB = parseInt(parts[1], 10) * 1024;
          const usedKB = parseInt(parts[2], 10) * 1024;
          const availKB = parseInt(parts[3], 10) * 1024;
          disks.push({
            mountPoint: parts[5],
            filesystem: parts[0],
            totalBytes: totalKB,
            totalGB: (totalKB / (1024 ** 3)).toFixed(2),
            usedBytes: usedKB,
            usedGB: (usedKB / (1024 ** 3)).toFixed(2),
            freeBytes: availKB,
            freeGB: (availKB / (1024 ** 3)).toFixed(2),
            usedPercent: totalKB > 0 ? ((usedKB / totalKB) * 100).toFixed(2) : "0",
            iopsSimulated: Math.floor(Math.random() * 500) + 100,
          });
        }
      }
    }
  } catch (e) {
    console.warn("[diskCollector] Fallback falló:", e.message);
  }
  return disks;
}
