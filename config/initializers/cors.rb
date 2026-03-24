Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      "http://localhost:5173",       # Vite dev server
      /\Ahttps:\/\/.*\.herokuapp\.com\z/ # Heroku production
    )

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]

    resource "/cable",
      headers: :any,
      methods: [ :get ],
      credentials: true
  end
end
