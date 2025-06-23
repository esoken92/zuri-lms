<html>
  <head>
    <title>Zuri Login</title>
    <link rel="icon" type="image/x-icon" href="data:image/x-icon;base64," />
    <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
    />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  </head>

  <body class="min-h-screen bg-gradient-to-br from-[#e7f0fd] to-[#f8fafc] font-['Inter',sans-serif] text-[#111418]">
    <div class="flex flex-col min-h-screen">
      <!-- Header -->
      <header class="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
        <div class="flex items-center gap-4">
          <svg class="w-6 h-6 text-blue-600" viewBox="0 0 48 48" fill="currentColor">
            <path
              d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
            />
          </svg>
          <h1 class="text-xl font-bold">Zuri Tyre Inspection</h1>
        </div>

        <!-- Server status indicator -->
        <div id="serverStatus" class="inline-flex items-center">
          <span id="statusDot" class="w-3 h-3 inline-block bg-orange-400 rounded-full mr-2"></span>
          <span id="statusLabel" class="text-gray-500 text-sm">Checking...</span>
        </div>
      </header>

      <!-- Login Card -->
      <main class="flex flex-1 items-center justify-center p-6">
        <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h2 class="text-2xl font-bold text-center mb-2">Welcome Back</h2>
          <p class="text-sm text-gray-500 text-center mb-6">Sign in to continue</p>

          <form class="space-y-4">
            <!-- Username -->
            <input
              type="text"
              placeholder="Username"
              class="w-full px-4 py-3 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <!-- Password with toggle -->
            <div class="relative">
              <input
                type="password"
                placeholder="Password"
                id="password"
                class="w-full px-4 py-3 pr-12 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                id="togglePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
              >
                👁️
              </button>
            </div>

            <!-- Remember & Forgot -->
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2">
                <input type="checkbox" class="form-checkbox text-blue-600 rounded" />
                Remember me
              </label>
              <a href="#" class="text-blue-600 hover:underline">Forgot password?</a>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Log In
            </button>
          </form>
        </div>
      </main>
    </div>

    <!-- JS for Password Toggle & Server Status -->
    <script>
      // Password toggle logic
      const passwordInput = document.getElementById("password");
      const togglePassword = document.getElementById("togglePassword");

      togglePassword.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.textContent = isHidden ? "🙈" : "👁️";
      });

      // Server Status Indicator
      const dot = document.getElementById("statusDot");
      const label = document.getElementById("statusLabel");

      async function checkServer() {
        label.textContent = "Checking...";
        dot.className = "w-3 h-3 inline-block bg-orange-400 rounded-full mr-2";

        try {
          const res = await fetch("/api/status");
          if (res.ok) {
            dot.className = "w-3 h-3 inline-block bg-green-500 rounded-full mr-2";
            label.textContent = "Online";
          } else {
            throw new Error("Bad status");
          }
        } catch (err) {
          dot.className = "w-3 h-3 inline-block bg-red-500 rounded-full mr-2";
          label.textContent = "Offline";
        }
      }

      checkServer();
      setInterval(checkServer, 10000); // Re-check every 10 seconds
    </script>
  </body>
</html>
