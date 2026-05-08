import fs from "node:fs";
import path from "node:path";
import { inArray } from "drizzle-orm";
import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { executionWorkspaces, projectWorkspaces } from "@paperclipai/db";
import { assertAuthenticated } from "./authz.js";

function isPathWithinBase(filePath: string, base: string): boolean {
  const rel = path.relative(base, filePath);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function workspaceFileRoutes(db: Db) {
  const router = Router();

  router.get("/local-file", async (req, res) => {
    try {
      assertAuthenticated(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    const rawPath = typeof req.query.path === "string" ? req.query.path.trim() : "";
    if (!rawPath) {
      return res.status(400).json({ error: "path query parameter is required" });
    }
    if (!path.isAbsolute(rawPath)) {
      return res.status(400).json({ error: "path must be an absolute path" });
    }

    const resolvedPath = path.resolve(rawPath);

    const actor = req.actor;
    const isInstanceAdmin = actor.type === "board" && (actor.source === "local_implicit" || actor.isInstanceAdmin === true);

    // Build query for accessible workspace cwds
    let projectRows: Array<{ cwd: string | null }>;
    let execRows: Array<{ cwd: string | null; providerRef: string | null }>;

    if (isInstanceAdmin) {
      // Instance admins can access all workspaces
      [projectRows, execRows] = await Promise.all([
        db.select({ cwd: projectWorkspaces.cwd }).from(projectWorkspaces),
        db.select({ cwd: executionWorkspaces.cwd, providerRef: executionWorkspaces.providerRef })
          .from(executionWorkspaces),
      ]);
    } else {
      const companyIds: string[] = actor.type === "board"
        ? (Array.isArray(actor.companyIds) ? actor.companyIds : [])
        : actor.type === "agent" && actor.companyId
          ? [actor.companyId]
          : [];

      if (!companyIds.length) {
        return res.status(403).json({ error: "No company access" });
      }

      [projectRows, execRows] = await Promise.all([
        db.select({ cwd: projectWorkspaces.cwd })
          .from(projectWorkspaces)
          .where(inArray(projectWorkspaces.companyId, companyIds)),
        db.select({ cwd: executionWorkspaces.cwd, providerRef: executionWorkspaces.providerRef })
          .from(executionWorkspaces)
          .where(inArray(executionWorkspaces.companyId, companyIds)),
      ]);
    }

    const allowedBases: string[] = [];
    for (const row of projectRows) {
      if (row.cwd) allowedBases.push(path.resolve(row.cwd));
    }
    for (const row of execRows) {
      const base = row.providerRef ?? row.cwd;
      if (base) allowedBases.push(path.resolve(base));
    }

    const allowed = allowedBases.some((base) => isPathWithinBase(resolvedPath, base));
    if (!allowed) {
      return res.status(403).json({ error: "Access denied: file is outside accessible workspaces" });
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolvedPath);
    } catch {
      return res.status(404).json({ error: "File not found" });
    }

    if (!stat.isFile()) {
      return res.status(400).json({ error: "Path is not a file" });
    }

    res.sendFile(resolvedPath, { dotfiles: "allow" }, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to serve file" });
      }
    });
  });

  return router;
}
