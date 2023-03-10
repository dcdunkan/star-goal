import { serve } from "https://deno.land/std@0.176.0/http/server.ts";

serve(async (req: Request) => {
  const event = req.headers.get("x-github-event");
  if (!event) {
    return Response.redirect("https://github.com/dcdunkan/star-goal");
  }
  const params = new URL(req.url).searchParams;
  const token = params.get("token");
  const chat = Number(params.get("chat_id"));
  const goal = Number(params.get("goal"));
  if (!token || isNaN(chat) || isNaN(goal)) {
    return new Response("invalid params", { status: 400 });
  }
  const payload = await req.json();
  if (event === "ping" && payload.hook.type === "Organization") {
    return new Response("org not supported yet", { status: 400 });
  }

  let message: string;
  const count = payload.repository.stargazers_count;
  const repo = payload.repository.full_name;
  if (event === "ping") {
    message = goal > count
      ? `${repo}: ${goal - count}`
      : `${repo}: The goal set (${goal}) is ${goal < count ? "lower than" : "equal to" } the count. \
Update the webhook URL and set a higher goal.`;
  } else if (event === "star") {
    if (payload.action === "created") {
      message = goal - count < 0
        ? `${repo}: already hit the goal of ${goal} stars. Set a new goal by editing the webhook.`
        : goal - count > 0
        ? `${repo}: ${goal - count}`
        : `🎉 Congratulations on your achievement! ${repo} now has ${count} stars! \
You can set a new goal by editing the webhook URL.`;
    } else {
      message = `${repo}: ${goal - count}\nSomeone just unstarred :(`;
    }
  } else {
    return new Response();
  }

  const { ok } = await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${encodeURIComponent(message)}`);
  return new Response(`${ok ? "" : "not"} ok`, { status: ok ? 200 : 500 });
}, {
  onError: console.error
});
