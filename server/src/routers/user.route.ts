import { Router } from "express";

const userRouter = Router();

userRouter.get("/", (req, res) => {
    res.send("user Roter is Working! :)");
});


export default userRouter;