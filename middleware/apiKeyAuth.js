
// apiKeyMiddleware.js

const API_KEY = 'Fentec@scooters.algaria';  // Replace with your API key

const apiKeyMiddleware = (req, res, next) => {
    const providedApiKey = req.headers['api_password'];

    if (!providedApiKey || providedApiKey !== API_KEY) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
};

module.exports = apiKeyMiddleware;
