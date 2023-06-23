import jwt from 'jsonwebtoken'


export const generateAccessToken = (id, role, refreshToken) => {
    const token = jwt.sign({ id, role, refreshToken },
        process.env.JWT_ACCESS_SECRET, { expiresIn: '10s' })
    return token
}

export const generateRefreshToken = (id, role) => {
    const token = jwt.sign({ id, role },
        process.env.JWT_REFRESH_SECRET, { expiresIn: '365d' })
    return token
}
