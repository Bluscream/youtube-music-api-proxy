using Microsoft.OpenApi.Models;
using YoutubeMusicAPIProxy.Services;
using YoutubeMusicAPIProxy.Configuration;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Configure embedded static files
builder.Services.Configure<StaticFileOptions>(options =>
{
    var assembly = typeof(Program).Assembly;
    var embeddedProvider = new EmbeddedFileProvider(assembly, "YoutubeMusicAPIProxy.wwwroot");
    options.FileProvider = embeddedProvider;
});

// Configure URLs from configuration
var httpPort = builder.Configuration.GetValue<int>("HttpPort", 80);
var httpsPort = builder.Configuration.GetValue<int>("HttpsPort", 443);
builder.WebHost.UseUrls($"http://localhost:{httpPort}", $"https://localhost:{httpsPort}");

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