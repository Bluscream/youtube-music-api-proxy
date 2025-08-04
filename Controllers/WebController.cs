using Microsoft.AspNetCore.Mvc;

namespace YoutubeMusicAPIProxy.Controllers;

[ApiController]
[Route("/")]
public class WebController : ControllerBase
{
    [HttpGet]
    public IActionResult Index()
    {
        return File("~/index.html", "text/html");
    }
} 