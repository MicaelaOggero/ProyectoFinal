import { Router } from "express";
import { authToken, authAdmin, auth } from "../../middlewares/auth.js";
import * as userController from "./user.controller.js";

const router = Router();

router.get("/", authToken, userController.getUsers);
router.get("/:id", authAdmin, userController.getUserById);
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", authAdmin, userController.deleteUser);

export default router;
