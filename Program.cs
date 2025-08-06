using Microsoft.OpenApi.Models;
using YoutubeMusicAPIProxy.Services;
using YoutubeMusicAPIProxy.Configuration;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

// Configure embedded static files
builder.Services.Configure<StaticFileOptions>(options =>
{
    var assembly = typeof(Program).Assembly;
    var embeddedProvider = new EmbeddedFileProvider(assembly, "YoutubeMusicAPIProxy.wwwroot");
    options.FileProvider = embeddedProvider;
});

// Configure URLs from configuration or environment variables
var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
if (string.IsNullOrEmpty(urls))
{
    var httpPort = builder.Configuration.GetValue<int>("HttpPort", 80);
    var httpsPort = builder.Configuration.GetValue<int>("HttpsPort", 443);
    
    // Configure Kestrel with HTTPS fallback
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.ListenAnyIP(httpPort); // HTTP port
        
        // Try to use default HTTPS configuration, fallback to custom certificate if needed
        try
        {
            serverOptions.ListenAnyIP(httpsPort, listenOptions =>
            {
                listenOptions.UseHttps();
            });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Unable to configure HTTPS endpoint") || ex.Message.Contains("No server certificate was specified"))
        {
            Console.WriteLine("Default HTTPS certificate not available, using custom self-signed certificate...");
            
            // Use existing certificate or create new one as fallback
            var certPath = Path.Combine(AppContext.BaseDirectory, "dev-cert.pfx");
            if (!File.Exists(certPath))
            {
                Console.WriteLine("Creating new self-signed certificate...");
                CreateSelfSignedCertificate(certPath);
            }
            else
            {
                Console.WriteLine("Using existing self-signed certificate...");
            }
            
            serverOptions.ListenAnyIP(httpsPort, listenOptions =>
            {
                listenOptions.UseHttps(certPath, "dev123");
            });
            
            Console.WriteLine($"Using custom self-signed certificate at: {certPath}");
        }
    });
}
else
{
    builder.WebHost.UseUrls(urls);
}

// Method to create self-signed certificate
static void CreateSelfSignedCertificate(string certPath)
{
    try
    {
        var distinguishedName = new X500DistinguishedName("CN=localhost");
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(distinguishedName, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        
        // Add Subject Alternative Names for multiple domains
        var sanBuilder = new SubjectAlternativeNameBuilder();
        sanBuilder.AddDnsName("localhost");
        sanBuilder.AddDnsName("ytm.local");
        sanBuilder.AddDnsName("ytm.vpn");
        sanBuilder.AddDnsName("ytm.remote");
        request.CertificateExtensions.Add(sanBuilder.Build());
        
        var certificate = request.CreateSelfSigned(DateTimeOffset.Now.AddDays(-1), DateTimeOffset.Now.AddYears(10));
        
        var pfxBytes = certificate.Export(X509ContentType.Pfx, "dev123");
        File.WriteAllBytes(certPath, pfxBytes);
        
        Console.WriteLine($"Self-signed certificate created at: {certPath}");
        Console.WriteLine("Certificate covers: localhost, ytm.local, ytm.vpn, ytm.remote");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to create self-signed certificate: {ex.Message}");
        throw;
    }
}

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "YouTube Music API Proxy", 
        Version = "v1",
        Description = "A .NET API wrapper around YouTubeMusicAPI for accessing YouTube Music data and streaming."
    });

    // Add security scheme for cookies parameter
    c.AddSecurityDefinition("cookies", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Query,
        Name = "cookies",
        Description = "Base64 encoded YouTube cookies for authentication"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "cookies"
                }
            },
            new string[] {}
        }
    });
});

// Add configuration
builder.Services.Configure<YouTubeMusicConfig>(builder.Configuration.GetSection("YouTubeMusic"));
builder.Services.Configure<LyricsConfig>(builder.Configuration.GetSection("Lyrics"));

// Add services
builder.Services.AddScoped<IYouTubeMusicService, YouTubeMusicService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
builder.Services.AddScoped<ILyricsService, LyricsService>();
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YouTube Music API Proxy v1");
        c.RoutePrefix = "swagger"; // Serve Swagger UI at /swagger
    });
}

// Only use HTTPS redirection if we're not in development or if HTTPS is explicitly configured
if (!app.Environment.IsDevelopment() || Environment.GetEnvironmentVariable("ASPNETCORE_URLS")?.Contains("https") == true)
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

// Run GetCookies on startup with print enabled
using (var scope = app.Services.CreateScope())
{
    var configService = scope.ServiceProvider.GetRequiredService<IConfigurationService>();
    configService.GetCookies(print: true);
}

app.Run(); 