export type NavItem = {
  name: string;
  icon: string;
  href?: string;
  action?: "logout";
};

export type User = {
  _id: string;
  email: string;
  username: string | null;
  role: "user" | "admin";
};
