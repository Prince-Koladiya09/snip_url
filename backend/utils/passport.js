const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ githubId: profile.id });
        if (!user && email) {
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            user.isEmailVerified = true;
            if (!user.avatar) user.avatar = profile.photos[0]?.value || "";
            await user.save();
          }
        }
        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email: email || `${profile.id}@github.local`,
            githubId: profile.id,
            avatar: profile.photos[0]?.value || "",
            provider: "github",
            isEmailVerified: true,
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
