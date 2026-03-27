output "api_alb_url" {
  value = aws_lb.api.dns_name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "frontend_cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "docdb_endpoint" {
  value = aws_docdb_cluster.main.endpoint
}
