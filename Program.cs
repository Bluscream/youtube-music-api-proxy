using Microsoft.OpenApi.Models;
using YoutubeMusicAPIProxy.Services;
using YoutubeMusicAPIProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "YouTube Music API Proxy v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run(); 