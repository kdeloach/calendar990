#/bin/bash
set -ex

. /opt/env.sh

cat >/tmp/policy.json <<EOF
{
   "Statement": [
      {
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::${BUCKET}/*"
      }
   ]
}
EOF

aws s3api put-bucket-policy --bucket ${BUCKET} --policy file:///tmp/policy.json
aws s3 website s3://${BUCKET} --index-document=index.html
aws s3 sync /vagrant/www/ s3://${BUCKET}
