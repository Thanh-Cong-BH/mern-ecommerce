import { Router } from 'express';

// import all the routes here
import authRoutes from './auth.route.js';
import accountRoutes from './account.route.js';
import userRoutes from './users.route.js';
import movieRoutes from './movie.route.js';
import userBehaviorRoutes from './user-behavior.route.js';
import watchlistRoutes from './watchlist.route.js';
import viewHistoryRoutes from './viewhistory.route.js'; 
import subscriptionRoutes from './subscription.route.js';
import reviewRoutes from './review.route.js';


const router = Router();

/**
 * GET v2/status
 */
router.get('/status', (req, res) => {
	res.json({
		success: true,
		timestamp: new Date().toISOString(),
		ip: req.ipv4,
		url: req.originalUrl,
	});
});

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/users', userRoutes);
router.use('/movie', movieRoutes);
router.use('/review', reviewRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/user-behavior', userBehaviorRoutes);
router.use('/viewhistory', viewHistoryRoutes);
router.use('/watchlist', watchlistRoutes);

if (process.env.NODE_ENV?.toString().startsWith('dev')) {
	
}

export default router;
