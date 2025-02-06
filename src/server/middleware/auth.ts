import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
        companyName: string;
    };
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Åtkomst nekad: Token saknas' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Kontrollera prenumerationsstatus
        const result = await pool.query(
            'SELECT subscription_status, subscription_expires_at FROM users WHERE id = $1',
            [user.id]
        );

        if (!result.rows[0] || !result.rows[0].subscription_status) {
            return res.status(403).json({ 
                error: 'Åtkomst nekad: Aktiv prenumeration krävs' 
            });
        }

        const subscriptionExpiry = new Date(result.rows[0].subscription_expires_at);
        if (subscriptionExpiry < new Date()) {
            return res.status(403).json({ 
                error: 'Åtkomst nekad: Prenumerationen har gått ut' 
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Åtkomst nekad: Ogiltig token' });
    }
};

export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Åtkomst nekad: Administratörsbehörighet krävs' 
        });
    }
    next();
};

export const requireBusiness = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'business') {
        return res.status(403).json({ 
            error: 'Åtkomst nekad: Företagsbehörighet krävs' 
        });
    }
    next();
}; 