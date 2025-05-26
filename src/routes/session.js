const express = require("express");
const router = express.Router();
const sessionService = require("../services/sessionService");
const userService = require("../services/userService");
const { requireAuth } = require("../middleware/auth");

// Middleware to add session data to all session routes
router.use(requireAuth);

// Session dashboard - list user's sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);

    res.render("sessions/index", {
      title: "Mis Sesiones",
      user: req.user,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Error al cargar las sesiones",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Form to create a new session
router.get("/new", (req, res) => {
  res.render("sessions/new", {
    title: "Crear Nueva Sesión",
    user: req.user,
    error: null,
  });
});

// Process new session creation
router.post("/new", async (req, res) => {
  try {
    const session = await sessionService.createSession(req.user.id);

    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error("Error creating session:", error);
    res.render("sessions/new", {
      title: "Crear Nueva Sesión",
      user: req.user,
      error: "No se pudo crear la sesión. Por favor intenta de nuevo.",
    });
  }
});

// Form to join an existing session
router.get("/join", (req, res) => {
  res.render("sessions/join", {
    title: "Unirse a Sesión",
    user: req.user,
    error: null,
  });
});

// Direct join via link
router.get("/join/:code", async (req, res) => {
  const { code } = req.params;

  // If user is not logged in, store code in session and redirect to login
  if (!req.user) {
    req.session.pendingSessionCode = code;
    return res.redirect("/auth");
  }

  try {
    const session = await sessionService.getSessionByCode(code);

    if (!session) {
      return res.render("sessions/join", {
        title: "Unirse a Sesión",
        user: req.user,
        error: "Código de sesión no válido",
        code,
      });
    }

    // If session is already in COLLECTING_IDEAS or further, don't allow joining
    if (session.status !== "WAITING") {
      return res.render("sessions/join", {
        title: "Unirse a Sesión",
        user: req.user,
        error: "La sesión ya ha comenzado y no acepta nuevos participantes",
        code,
      });
    }

    // Add user to session
    await sessionService.addParticipant(session.id, req.user.id);

    // Update user's last active timestamp
    await userService.updateUserActivity(req.user.id);

    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error("Error joining session via link:", error);
    res.render("sessions/join", {
      title: "Unirse a Sesión",
      user: req.user,
      error: "Error al unirse a la sesión. Por favor intenta de nuevo.",
      code,
    });
  }
});

// Process join session form
router.post("/join", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.trim() === "") {
      return res.render("sessions/join", {
        title: "Unirse a Sesión",
        user: req.user,
        error: "El código de sesión es requerido",
      });
    }

    const session = await sessionService.getSessionByCode(code);

    if (!session) {
      return res.render("sessions/join", {
        title: "Unirse a Sesión",
        user: req.user,
        error: "Código de sesión no válido",
      });
    }

    // If session is already in COLLECTING_IDEAS or further, don't allow joining
    if (session.status !== "WAITING") {
      return res.render("sessions/join", {
        title: "Unirse a Sesión",
        user: req.user,
        error: "La sesión ya ha comenzado y no acepta nuevos participantes",
      });
    }

    // Add user to session
    await sessionService.addParticipant(session.id, req.user.id);

    // Update user's last active timestamp
    await userService.updateUserActivity(req.user.id);

    res.redirect(`/session/${session.id}`);
  } catch (error) {
    console.error("Error joining session:", error);
    res.render("sessions/join", {
      title: "Unirse a Sesión",
      user: req.user,
      error: "Error al unirse a la sesión. Por favor intenta de nuevo.",
    });
  }
});

// Polling endpoint for session updates
router.get("/:id/updates", async (req, res) => {
  try {
    const { id } = req.params;
    const { since } = req.query;

    if (!since) {
      return res.status(400).json({ error: "Missing since parameter" });
    }

    // Verify user is a participant in the session
    const participants = await sessionService.getSessionParticipants(id);
    const isParticipant = participants.some((p) => p.id === req.user.id);

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "No estás autorizado para ver esta sesión" });
    }

    // Get session updates since the specified time
    const updates = await sessionService.getSessionUpdates(id, since);

    // Update user's last active timestamp
    await userService.updateUserActivity(req.user.id);

    res.json(updates);
  } catch (error) {
    console.error("Error getting session updates:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// View a specific session
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSession(id);

    if (!session) {
      return res.status(404).render("error", {
        title: "Sesión no encontrada",
        message: "La sesión que estás buscando no existe",
      });
    }

    const participants = await sessionService.getSessionParticipants(id);
    const isOwner = session.owner_id === req.user.id;

    // If user is not a participant, redirect to join page with code
    const isParticipant = participants.some((p) => p.id === req.user.id);
    if (!isParticipant) {
      return res.redirect(`/session/join?code=${session.code}`);
    }

    // Update user's last active timestamp
    await userService.updateUserActivity(req.user.id);

    res.render("sessions/detail", {
      title: `Sesión: ${session.code}`,
      user: req.user,
      session,
      participants,
      isOwner,
      scripts: ["/js/session.js", "/js/ideas.js"],
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).render("error", {
      title: "Error",
      message: "Error al cargar la sesión",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
});

// Start the session (owner only)
router.post("/:id/start", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is session owner
    const isOwner = await sessionService.isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: "Solo el creador de la sesión puede iniciarla",
      });
    }

    // Check if there are enough participants (at least 2)
    const participants = await sessionService.getSessionParticipants(id);
    if (participants.length < 2) {
      return res.status(400).json({
        error: "Se necesitan al menos 2 participantes para iniciar la sesión",
      });
    }

    // Update session status
    const session = await sessionService.updateSessionStatus(
      id,
      "COLLECTING_IDEAS"
    );

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Error al iniciar la sesión" });
  }
});

// Start the voting phase (owner only)
router.post("/:id/start-voting", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is session owner
    const isOwner = await sessionService.isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error:
          "Solo el creador de la sesión puede avanzar a la fase de votación",
      });
    }

    // Get the current session to check status
    const session = await sessionService.getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    if (session.status !== "COLLECTING_IDEAS") {
      return res.status(400).json({
        error: "La sesión no está en fase de recolección de ideas",
      });
    }

    // Check if there are any ideas in the session
    const ideaService = require("../services/ideaService");
    const ideasCount = await ideaService.countIdeasInSession(id);

    if (ideasCount === 0) {
      return res.status(400).json({
        error: "Debe haber al menos una idea para avanzar a la votación",
      });
    }

    // Update session status to voting
    const updatedSession = await sessionService.updateSessionStatus(
      id,
      "VOTING"
    );

    // Set round to 1
    await sessionService.updateSessionRound(id, 1);

    res.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error("Error starting voting phase:", error);
    res.status(500).json({ error: "Error al iniciar la fase de votación" });
  }
});

// Delete a session (owner only)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is session owner
    const isOwner = await sessionService.isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: "Solo el creador de la sesión puede eliminarla",
      });
    }

    // Delete the session
    const success = await sessionService.deleteSession(id);

    if (!success) {
      return res.status(500).json({ error: "Error al eliminar la sesión" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Error al eliminar la sesión" });
  }
});

// Alternative for DELETE route since some Express setups have issues with DELETE
router.post("/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is session owner
    const isOwner = await sessionService.isSessionOwner(id, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        error: "Solo el creador de la sesión puede eliminarla",
      });
    }

    // Delete the session
    const success = await sessionService.deleteSession(id);

    if (!success) {
      return res.status(500).json({ error: "Error al eliminar la sesión" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting session in POST route:", error);
    res.status(500).json({ error: "Error al eliminar la sesión" });
  }
});

// Get participants for a session (JSON endpoint)
router.get("/:id/participants", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    const participants = await sessionService.getSessionParticipants(id);
    res.json({ participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Get all ideas for a session (for maestro view)
router.get("/:id/all-ideas", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    // Verify user is the session owner
    if (session.owner_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver todas las ideas" });
    }

    // Get all ideas for the session with author info
    const db = require("../lib/db");
    const ideas = await db.all(
      `
      SELECT i.*, u.name as author_name 
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.session_id = ?
      ORDER BY i.created_at ASC
    `,
      [id]
    );

    res.json({ ideas });
  } catch (error) {
    console.error("Error fetching all ideas:", error);
    res.status(500).json({ error: "Error al cargar las ideas" });
  }
});

// Get session status
router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    res.json({ status: session.status });
  } catch (error) {
    console.error("Error fetching session status:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
