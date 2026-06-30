function register(req, res) {
    res.send("Register Page!")
}

function login(req, res) {
    res.send("Login Page!")
}

function refresh(req, res) {
    res.send("Refresh Page!")
}

function logout(req, res) {
    res.send("Logout Page!")
}

module.exports = { register, login, refresh, logout }