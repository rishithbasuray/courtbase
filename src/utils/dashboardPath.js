export function dashboardPathForRole(role) {
  switch (role) {
    case "Coach":
      return "/coach-dashboard";
    case "Tournament Official":
      return "/official-dashboard";
    case "Scout":
      return "/scout-dashboard";
    case "Player":
    default:
      return "/profile";
  }
}