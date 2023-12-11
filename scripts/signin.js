const apiUrl = "https://656cc60fe1e03bfd572ebb91.mockapi.io/api/azar";

const signupForm = document.querySelector(".signup form");
const loginForm = document.querySelector(".login form");
const signupSuccessMessageElement = document.getElementById('signupSuccessMessage');
const errorMessageElement = document.getElementById('errorMessage');

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(signupForm);
  const name = formData.get('fullname');
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    // Check if the email already exists
    const usersResponse = await fetch(`${apiUrl}/user`);
    const users = await usersResponse.json();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      // Email already exists, display an error message
      console.error("Signup failed: Email already exists");
      errorMessageElement.textContent = "Email already exists. Please use a different email.";
    } else {
      // Proceed with signup
      const response = await fetch(`${apiUrl}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        // Successful signup, clear textfields and display a success message
        console.log("Signup successful");
        signupSuccessMessageElement.textContent = "Signup successful. You can now log in.";
        
        // Clear textfields
        signupForm.reset();
      } else {
        // Handle signup failure and display error message
        const errorMessage = await response.text();
        console.error("Signup failed:", errorMessage);
        errorMessageElement.textContent = errorMessage;
      }
    }
  } catch (error) {
    console.error("Error during signup:", error);
    // Display a generic error message
    errorMessageElement.textContent = "An error occurred during signup.";
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    // Fetch the list of users from the database
    const usersResponse = await fetch(`${apiUrl}/user`);
    const users = await usersResponse.json();

    // Check if there is a user with the provided email and password
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Successful login, save user information to localStorage
      localStorage.setItem('loggedInUserId', user.id);
      localStorage.setItem('loggedInUserName', user.name);

      // Redirect to the task manager page
      window.location.href = "task_manager.html"; // Change to the correct URL
    } else {
      // Handle login failure (invalid credentials) and display error message
      console.error("Login failed: Invalid email or password");
      errorMessageElement.textContent = "Invalid email or password. Please try again.";
    }
  } catch (error) {
    console.error("Error during login:", error);
    // Display a generic error message
    errorMessageElement.textContent = "An error occurred during login.";
  }
});
