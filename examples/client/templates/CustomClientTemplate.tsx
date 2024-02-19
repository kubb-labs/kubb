import { File, Function, Editor } from '@kubb/react'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'
import { useOperationFile } from '@kubb/swagger/hooks'

export const templates = {
  default: function({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
    const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

    const filePython = useOperationFile({ extName: '.py' })
    const fileKotlin = useOperationFile({ extName: '.kt' })

    return (
      <>
        <Editor language="typescript">
          <File.Import name="axios" path="axios" />
          <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
            {`return axios.${client.method}(${clientParams})`}
          </Function>
        </Editor>
        <Editor language="text">
          <File
            baseName={fileKotlin.baseName}
            path={fileKotlin.path}
            meta={fileKotlin.meta}
          >
            <File.Source>
              {`
package com.example.blog

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HtmlController {

  @GetMapping("${client.path.URL}")
  fun ${name}(model: Model): String {
    model["title"] = "Blog"
    return "blog"
  }
}
        `}
            </File.Source>
          </File>
        </Editor>
        <Editor language="text">
          <File
            baseName={filePython.baseName}
            path={filePython.path}
            meta={filePython.meta}
          >
            <File.Source>
              import requests
              <br />
              <br />
              {`response = requests.${client.method}("${client.path.URL}")`}
              <br />
              <br />
              print(response.status_code)
            </File.Source>
          </File>
        </Editor>
      </>
    )
  },
} as const
