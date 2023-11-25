module.exports = (req, res, next) => {
    if(!req.session.user) {
        return res.redirect("/v1/login");
    }
    else return next();
}