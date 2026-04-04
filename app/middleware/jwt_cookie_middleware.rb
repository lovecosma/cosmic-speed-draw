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

    status, headers, body = @app.call(env)

    if (auth_header = headers["Authorization"])
      jwt = auth_header.delete_prefix("Bearer ")
      response = Rack::Response.new(body, status, headers)
      response.set_cookie(COOKIE_NAME, {
        value: jwt,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax,
        path: "/"
      })
      response.delete_header("Authorization")
      return response.finish
    end

    if sign_out_request?(env) && status < 400
      response = Rack::Response.new(body, status, headers)
      response.delete_cookie(COOKIE_NAME, { path: "/" })
      return response.finish
    end

    [ status, headers, body ]
  end

  private

  def sign_out_request?(env)
    env["REQUEST_METHOD"] == "DELETE" && env["PATH_INFO"].end_with?("/sign_out")
  end
end
