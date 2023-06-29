import jwt from 'jsonwebtoken'


export const generateAccessToken = (id, role, nickname, refreshToken) => {
    const token = jwt.sign({ id, role, nickname, refreshToken },
        process.env.JWT_ACCESS_SECRET, { expiresIn: '10s' })
    return token
}

export const generateRefreshToken = (id, role, nickname) => {
    const token = jwt.sign({ id, role, nickname },
        process.env.JWT_REFRESH_SECRET, { expiresIn: '365d' })
    return token
}
