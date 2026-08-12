import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
} from '../controllers/user.controller';
import { verifyJWT } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/multer.middleware';

const router = Router();

// Public routes
router.route('/register').post(upload.fields([
    {
            name:"profileImage",
            maxCount:1 // kitni files accept kroge

        },
]),registerUser);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);

// Protected routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser)

export default router;