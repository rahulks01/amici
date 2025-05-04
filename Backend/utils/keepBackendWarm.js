import { Router } from "express";

const router = Router();

router.get("/", (req, res, next) => {
    console.log("Backend warm request by cron-jobs");

    res.status(200).json({
        status: "success",
        message: "Application is warm!"
    })
})

export default router;