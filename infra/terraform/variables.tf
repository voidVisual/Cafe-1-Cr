variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "Cafe-1-cr"
}

variable "api_image" {
  type        = string
  description = "Full image URI for the API container (e.g., <account>.dkr.ecr.<region>.amazonaws.com/<repo>:tag)"
}

variable "api_port" {
  type    = number
  default = 8000
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "max_count" {
  type    = number
  default = 3
}

variable "docdb_username" {
  type = string
}

variable "docdb_password" {
  type      = string
  sensitive = true
}
