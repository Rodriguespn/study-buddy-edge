/**
 * OAuth Consent Page HTML
 *
 * Inline HTML for the consent page since serveStatic doesn't work reliably
 * in Supabase Edge Functions. This page fetches Supabase config from the
 * /oauth/config.json endpoint dynamically.
 */

export const CONSENT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Study Buddy</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 440px;
      width: 100%;
      overflow: hidden;
    }

    .header {
      background: #f8f9fa;
      padding: 24px;
      text-align: center;
      border-bottom: 1px solid #e9ecef;
    }

    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 28px;
    }

    .header h1 {
      font-size: 20px;
      color: #212529;
      margin-bottom: 4px;
    }

    .header p {
      color: #6c757d;
      font-size: 14px;
    }

    .content {
      padding: 24px;
    }

    .client-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .client-name {
      font-weight: 600;
      color: #212529;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .client-id {
      color: #6c757d;
      font-size: 12px;
      word-break: break-all;
    }

    .permissions {
      margin-bottom: 24px;
    }

    .permissions h3 {
      font-size: 14px;
      color: #495057;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .permission-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }

    .permission-item:last-child {
      border-bottom: none;
    }

    .permission-icon {
      width: 36px;
      height: 36px;
      background: #e9ecef;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-size: 16px;
    }

    .permission-text {
      flex: 1;
    }

    .permission-text strong {
      display: block;
      color: #212529;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .permission-text span {
      color: #6c757d;
      font-size: 12px;
    }

    .buttons {
      display: flex;
      gap: 12px;
    }

    button {
      flex: 1;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-approve {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-approve:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-deny {
      background: #e9ecef;
      color: #495057;
    }

    .btn-deny:hover {
      background: #dee2e6;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }

    .loading {
      text-align: center;
      padding: 60px 24px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e9ecef;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error {
      background: #fff5f5;
      border: 1px solid #feb2b2;
      color: #c53030;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .footer {
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      text-align: center;
    }

    .footer p {
      color: #6c757d;
      font-size: 12px;
    }

    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📚</div>
      <h1>Study Buddy</h1>
      <p>Language Learning Flashcards</p>
    </div>

    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading authorization details...</p>
    </div>

    <div id="consent" class="content" style="display: none;">
      <div id="error" class="error" style="display: none;"></div>

      <div class="client-info">
        <div class="client-name" id="clientName">Application</div>
        <div class="client-id" id="clientId"></div>
      </div>

      <div class="permissions">
        <h3>This app is requesting access to:</h3>
        <div id="scopesList">
          <div class="permission-item">
            <div class="permission-icon">👤</div>
            <div class="permission-text">
              <strong>Your profile information</strong>
              <span>Basic account details</span>
            </div>
          </div>
          <div class="permission-item">
            <div class="permission-icon">📧</div>
            <div class="permission-text">
              <strong>Your email address</strong>
              <span>View your email</span>
            </div>
          </div>
          <div class="permission-item">
            <div class="permission-icon">📚</div>
            <div class="permission-text">
              <strong>Your flashcard decks</strong>
              <span>Create, view, and manage your study decks</span>
            </div>
          </div>
        </div>
      </div>

      <div class="buttons">
        <button class="btn-deny" id="denyBtn" onclick="handleDeny()">Deny</button>
        <button class="btn-approve" id="approveBtn" onclick="handleApprove()">Approve</button>
      </div>
    </div>

    <div class="footer">
      <p>By approving, you allow this app to access your data according to its <a href="#">privacy policy</a>.</p>
    </div>
  </div>

  <script>
    // Get configuration from the server
    let supabaseUrl = '';
    let supabaseAnonKey = '';
    let supabase = null;
    let authorizationId = null;

    // Extract authorization_id from URL
    const urlParams = new URLSearchParams(window.location.search);
    authorizationId = urlParams.get('authorization_id');

    async function init() {
      try {
        // Fetch configuration from server (relative path works with Edge Function base path)
        const configRes = await fetch('./config.json');
        if (!configRes.ok) {
          showError('Configuration error. Please contact support.');
          return;
        }
        const config = await configRes.json();
        supabaseUrl = config.supabaseUrl;
        supabaseAnonKey = config.supabaseAnonKey;

        // Initialize Supabase client
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

        // Handle OAuth callback - Supabase returns tokens in URL hash after login
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
        }

        if (!authorizationId) {
          showError('Missing authorization_id parameter');
          return;
        }

        // Get authorization details
        await loadAuthorizationDetails();

      } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load authorization details. Please try again.');
      }
    }

    async function loadAuthorizationDetails() {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        console.log('Current session:', session);
        console.log('User ID:', session?.user?.id);

        if (!session) {
          // Redirect to Google OAuth login, then back to this consent page
          const { error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.href,
            },
          });
          if (signInError) {
            throw signInError;
          }
          return;
        }

        // Get authorization request details
        const { data: authRequest, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

        if (error) {
          throw error;
        }

        // Update UI with client info
        if (authRequest) {
          document.getElementById('clientName').textContent = authRequest.client?.name || 'Unknown Application';
          document.getElementById('clientId').textContent = 'Client ID: ' + (authRequest.client_id || 'Unknown');
        }

        // Show consent UI
        document.getElementById('loading').style.display = 'none';
        document.getElementById('consent').style.display = 'block';

      } catch (error) {
        console.error('Error loading authorization:', error);
        showError('Failed to load authorization details: ' + error.message);
      }
    }

    async function handleApprove() {
      const approveBtn = document.getElementById('approveBtn');
      const denyBtn = document.getElementById('denyBtn');

      approveBtn.disabled = true;
      denyBtn.disabled = true;
      approveBtn.textContent = 'Approving...';

      try {
        const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);

        if (error) {
          throw error;
        }

        // Redirect back to the requesting application
        if (data?.redirect_to) {
          window.location.href = data.redirect_to;
        }

      } catch (error) {
        console.error('Approval error:', error);
        showError('Failed to approve authorization: ' + error.message);
        approveBtn.disabled = false;
        denyBtn.disabled = false;
        approveBtn.textContent = 'Approve';
      }
    }

    async function handleDeny() {
      const approveBtn = document.getElementById('approveBtn');
      const denyBtn = document.getElementById('denyBtn');

      approveBtn.disabled = true;
      denyBtn.disabled = true;
      denyBtn.textContent = 'Denying...';

      try {
        const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId);

        if (error) {
          throw error;
        }

        // Redirect back to the requesting application with error
        if (data?.redirect_to) {
          window.location.href = data.redirect_to;
        }

      } catch (error) {
        console.error('Deny error:', error);
        showError('Failed to deny authorization: ' + error.message);
        approveBtn.disabled = false;
        denyBtn.disabled = false;
        denyBtn.textContent = 'Deny';
      }
    }

    function showError(message) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('consent').style.display = 'block';
      const errorEl = document.getElementById('error');
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    // Initialize on page load
    init();
  </script>
</body>
</html>`;
