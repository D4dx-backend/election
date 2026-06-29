const { buildNotificationsForUser } = require("../lib/notifications/buildNotifications");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await buildNotificationsForUser(req.user);
    const unreadCount = notifications.length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    console.error("Controller Error in getNotifications:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};
