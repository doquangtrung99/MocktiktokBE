
const checkPermission = (permission) => {

    return (req, res, next) => {
        // const { role } = req.headers.authorization.split(' ')[1]
        const role = 'admin'

        if (permission.includes(role)) {
            next()
        } else {
            res.status(401).json({
                status: 'Unauthorized'
            })
        }
    }
}

export default checkPermission