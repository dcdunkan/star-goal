import { serve } from "https://deno.land/std@0.176.0/http/server.ts";

serve(async (req: Request) => {
  const event = req.headers.get("x-github-event");
  if (!event) {
    return new Response("https://github.com/dcdunkan/star-goal");
  }
  const params = new URL(req.url).searchParams;
  const token = params.get("token");
  const chat = Number(params.get("chat_id"));
  const goal = Number(params.get("goal"));
  if (!token || isNaN(chat) || isNaN(goal)) {
    return new Response("invalid params")
  }
  const payload = await req.json();
  if (payload.hook.type === "Organization") {
    return new Response("org not supported yet", { status: 400 });
  }

  let message: string;
  const count = payload.repository.stargazers_count;
  const repo = payload.repository.full_name;
  if (event === "ping") {
    const starInfo = goal > count
      ? `${goal - count}`
      : `goal is ${goal < count ? "lower than" : "equal to" } the count. \
please update the url`;
    message = `${repo}: ${starInfo}`;
  } else if (event === "star") {
    message = goal - count < 0
      ? `${repo}: already hit the goal ${goal}. please update the url`
      : goal - count > 0
      ? `${repo}: ${goal - count}`
      : `🎉 yay! ${repo} now has ${count} stars! \
update the goal in the webhook url.`;
  } else if (event === "unstar") {
    message = `${repo}: someone just unstarred :(`;
  } else {
    return new Response();
  }

  const { ok }= await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${message}`);
  return new Response(`${ok ? "not" : ""} ok`, { status: ok ? 200 : 500 });
});
