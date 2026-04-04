Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("CORS_ORIGIN", "http://localhost:5173")

    resource "/api/*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]

    resource "/cable",
      headers: :any,
      methods: [ :get ],
      credentials: true
  end
end
