import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateAccountDetails,
  updateProfileImage,
  verifyEmail,
  resendVerificationEmail,
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
router.route("/verify-email").get(verifyEmail);

// Protected routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-avatar").patch(verifyJWT, upload.single("profileImage"), updateProfileImage);
router.route("/resend-verification").post(verifyJWT, resendVerificationEmail);


export default router;