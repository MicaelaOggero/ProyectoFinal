import {Router} from 'express';
import { obtenerHabilidades } from './skills.controller.js';

const router = Router()

router.get('/', obtenerHabilidades);

export default router;
