const { models } = require('../libs/sequelize');

class NotificationService {
    async create (notification) {
        const notificationCreated = await models.Notification.create(notification);
        console.log (notificationCreated);
        return notificationCreated;
    }
    async findAll () {
        const notifications = await models.Notification.findAll();
        console.log (notifications);
        return notifications;
    }
    async findById (id) {
        const notification = await models.Notification.findOne({ 
            where: {
                id_notification: id
            }
        });
        console.log (notification);
        return notification;
    }
}

module.exports = NotificationService;
