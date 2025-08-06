using Microsoft.OpenApi.Models;
using YoutubeMusicAPIProxy.Services;
using YoutubeMusicAPIProxy.Configuration;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

// Create self-signed certificate on first start
var certPath = Path.Combine(AppContext.BaseDirectory, "dev-cert.pfx");
if (!File.Exists(certPath))
{
    CreateSelfSignedCertificate(certPath);
}

// Configure Kestrel with HTTPS
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(80); // HTTP port
    serverOptions.ListenAnyIP(443, listenOptions =>
    {
        listenOptions.UseHttps(certPath, "dev123");
    });
});

// Add services to the container.
builder.Services.AddControllers();

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

// Add services
builder.Services.AddScoped<IYouTubeMusicService, YouTubeMusicService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();
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

app.UseHttpsRedirection();
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

// Method to create self-signed certificate
static void CreateSelfSignedCertificate(string certPath)
{
    try
    {
        var distinguishedName = new X500DistinguishedName("CN=localhost");
        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest(distinguishedName, rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        
        var certificate = request.CreateSelfSigned(DateTimeOffset.Now.AddDays(-1), DateTimeOffset.Now.AddYears(10));
        
        var pfxBytes = certificate.Export(X509ContentType.Pfx, "dev123");
        File.WriteAllBytes(certPath, pfxBytes);
        
        Console.WriteLine($"Self-signed certificate created at: {certPath}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to create self-signed certificate: {ex.Message}");
        throw;
    }
} 