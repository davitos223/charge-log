using System.Diagnostics;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace ChargeLog;

static class Program
{
    // The app shows the live GitHub Pages site, so every push to GitHub updates it.
    public const string AppUrl = "https://davitos223.github.io/charge-log/";

    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

sealed class MainForm : Form
{
    static readonly string DataDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ChargeLog");
    static readonly string BoundsFile = Path.Combine(DataDir, "window.txt");

    readonly WebView2 web = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(238, 242, 244) };

    public MainForm()
    {
        Text = "Charge Log";
        MinimumSize = new Size(420, 560);
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(1100, 860);
        BackColor = Color.FromArgb(238, 242, 244);
        using (var s = typeof(MainForm).Assembly.GetManifestResourceStream("app.ico"))
            if (s != null) Icon = new Icon(s);
        Controls.Add(web);
        RestoreBounds_();
        FormClosing += (_, _) => SaveBounds();
        Load += async (_, _) => await InitAsync();
    }

    async Task InitAsync()
    {
        try
        {
            Directory.CreateDirectory(DataDir);
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(DataDir, "WebView2"));
            await web.EnsureCoreWebView2Async(env);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(this,
                "Charge Log needs the Microsoft Edge WebView2 Runtime.\n\nInstall it from https://go.microsoft.com/fwlink/p/?LinkId=2124703 and start Charge Log again.",
                "Charge Log", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
            return;
        }

        var core = web.CoreWebView2;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.AreDefaultContextMenusEnabled = true;

        // Links to other sites open in the normal browser.
        core.NewWindowRequested += (_, e) => { e.Handled = true; OpenExternal(e.Uri); };
        core.NavigationStarting += (_, e) =>
        {
            if (!e.Uri.StartsWith(Program.AppUrl, StringComparison.OrdinalIgnoreCase) &&
                !e.Uri.StartsWith("data:", StringComparison.OrdinalIgnoreCase) &&
                !e.Uri.StartsWith("about:", StringComparison.OrdinalIgnoreCase))
            { e.Cancel = true; OpenExternal(e.Uri); }
        };
        core.NavigationCompleted += (_, e) =>
        {
            if (!e.IsSuccess && e.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled)
                core.NavigateToString(OfflineHtml);
        };
        core.WebMessageReceived += (_, e) => { if (e.TryGetWebMessageAsString() == "retry") core.Navigate(Program.AppUrl); };

        core.Navigate(Program.AppUrl);
    }

    static void OpenExternal(string url)
    {
        if (!url.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return;
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); } catch { }
    }

    void RestoreBounds_()
    {
        try
        {
            var p = File.ReadAllText(BoundsFile).Split(',').Select(int.Parse).ToArray();
            var r = new Rectangle(p[0], p[1], p[2], p[3]);
            if (Screen.AllScreens.Any(s => s.WorkingArea.IntersectsWith(r)))
            { StartPosition = FormStartPosition.Manual; Bounds = r; if (p.Length > 4 && p[4] == 1) WindowState = FormWindowState.Maximized; }
        }
        catch { }
    }

    void SaveBounds()
    {
        try
        {
            Directory.CreateDirectory(DataDir);
            var b = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            File.WriteAllText(BoundsFile, $"{b.X},{b.Y},{b.Width},{b.Height},{(WindowState == FormWindowState.Maximized ? 1 : 0)}");
        }
        catch { }
    }

    const string OfflineHtml = """
        <!doctype html><html><head><meta charset="utf-8"><style>
        body{margin:0;height:100vh;display:grid;place-items:center;background:#EEF2F4;color:#0E2230;font:15px "Segoe UI",sans-serif;text-align:center}
        @media (prefers-color-scheme:dark){body{background:#0A141B;color:#E4EDF2}}
        h1{font-size:22px;margin:0 0 8px} p{margin:0 0 18px;opacity:.75}
        button{font:600 15px "Segoe UI",sans-serif;border:0;border-radius:12px;padding:11px 20px;background:#0B7A93;color:#fff;cursor:pointer}
        </style></head><body><div><h1>Can't reach Charge Log</h1>
        <p>Check the internet connection. Your charges are safe on this PC.</p>
        <button onclick="chrome.webview.postMessage('retry')">Try again</button></div></body></html>
        """;
}
