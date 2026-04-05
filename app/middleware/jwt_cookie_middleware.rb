class JwtCookieMiddleware
  COOKIE_NAME = "jwt_token"

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    if (jwt = request.cookies[COOKIE_NAME])
      env["HTTP_AUTHORIZATION"] = "Bearer #{jwt}"
    end
    @app.call(env)
  end
end
