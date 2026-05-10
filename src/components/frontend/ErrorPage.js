function Home({ user }) {
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <p>Your role: {user.role}</p>
    </div>
  );
}